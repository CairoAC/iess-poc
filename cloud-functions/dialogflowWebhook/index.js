const {Firestore} = require('@google-cloud/firestore');
const {Client} = require("@googlemaps/google-maps-services-js");

const firestore = new Firestore();
const client = new Client({});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c; 
}

async function geocodeAddress(address) {
    try {
        const response = await client.geocode({
            params: {
                address: address,
                key: process.env.GOOGLE_MAPS_API_KEY, 
            },
        });
        if (response.data.results.length > 0) {
            const {lat, lng} = response.data.results[0].geometry.location;
            return {latitude: lat, longitude: lng};
        } else {
            console.log("Nenhum resultado encontrado para o endereço.");
            return null;
        }
    } catch (error) {
        console.error("Erro ao geocodificar o endereço:", error);
        return null;
    }
}

exports.dialogflowWebhook = async (req, res) => {
    const careUnitsRef = firestore.collection('Unidades de Atendimento');
    const snapshot = await careUnitsRef.get();
    
    if (snapshot.empty) {
        console.log('Nenhum documento correspondente.');
        return;
    }

    let units = [];
    for (const doc of snapshot.docs) {
        let data = doc.data();
        const coordinates = await geocodeAddress(data.Address);
        if (coordinates) {
            const distance = calculateDistance(req.body.payload.location.latitude, req.body.payload.location.longitude, coordinates.latitude, coordinates.longitude);
            units.push({
                name: data.Name,
                address: data.Address,
                distance: distance
            });
        }
    }

    units.sort((a, b) => a.distance - b.distance);

    let unitsMessage = units.map(u => `${u.name} está a ${u.distance.toFixed(2)} de distancia.`).join('\n');
    let closestUnitMessage = `La unidad más cercana es less Ventanas ${units[0].name}, a ${units[0].distance.toFixed(2)} de distancia.`;

    res.json({
        fulfillment_response: {
            messages: [{
                text: {
                    text: [unitsMessage + '\n\n' + closestUnitMessage]
                }
            }]
        }
    });
};
