const {Firestore} = require('@google-cloud/firestore');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const {google} = require('googleapis');
const firestore = new Firestore();

const secretClient = new SecretManagerServiceClient();

exports.dialogflowScheduleUnitWebhook = async (req, res) => {
    console.log(req.body.sessionInfo.parameters);

    const chosenUnitName = req.body.sessionInfo.parameters.chooseunit;
    console.log("Unidade escolhida recebida:", chosenUnitName);

    if (!chosenUnitName) {
        res.json(createResponse("No entendí la unidad elegida. ¿Puedes repetir, por favor?"));
        return;
    }

    try {
        const unitSnapshot = await firestore.collection('Unidades de Atendimento').where('Name', '==', chosenUnitName).get();

        if (unitSnapshot.empty) {
            res.json(createResponse("No encontré una unidad con ese nombre. Por favor, elige una unidad válida."));
        } else {
            const unitDoc = unitSnapshot.docs[0];
            const unitEmail = unitDoc.data().Email; 

            const eventResult = await createGoogleMeetEvent(unitEmail);
            if (eventResult) {
                res.json(createResponse(`La unidad elegida fue ${chosenUnitName}. El enlace de Google Meet es: ${eventResult}. Se hizo la cita. Guarde el link.`));
            } else {
                res.json(createResponse("Hubo un error al crear el evento de Google Meet. Por favor, intenta de nuevo."));
            }
        }
    } catch (error) {
        console.error('Erro ao buscar a unidade:', error);
        res.json(createResponse("Hubo un error al procesar tu elección. Por favor, intenta de nuevo."));
    }
};

function createResponse(text) {
    return {
        fulfillment_response: {
            messages: [{
                text: { text: [text] }
            }]
        }
    };
}

async function getSecret(secretName) {
    console.log(`Accessing secret: ${secretName}`);
    const [version] = await secretClient.accessSecretVersion({
        name: secretName
    });
    const payload = version.payload.data.toString('utf8');
    console.log('Secret payload received:', payload);
    return JSON.parse(payload);
}

async function createGoogleMeetEvent(unitEmail) {
    const secretName = "projects/1043917236633/secrets/calendar-credentials/versions/latest";
    const credentials = await getSecret(secretName);
    console.log(secretName);

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        subject: unitEmail
    });

    const calendar = google.calendar({version: 'v3', auth: auth});
    const event = {
        summary: 'Consulta Médica',
        location: 'Google Meet',
        description: 'Una consulta médica virtual a través de Google Meet.',
        start: {
            dateTime: '2024-04-20T10:00:00',
            timeZone: 'America/Sao_Paulo',
        },
        end: {
            dateTime: '2024-04-20T11:00:00',
            timeZone: 'America/Sao_Paulo',
        },
        reminders: {
            useDefault: false,
            overrides: [
                {method: 'email', minutes: 24 * 60},
                {method: 'popup', minutes: 10},
            ],
        },
        conferenceData: {
            createRequest: {requestId: "sample123", conferenceSolutionKey: {type: "hangoutsMeet"}}
        },
    };

    try {
        const {data} = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendNotifications: true,
        });

        console.log('Evento do Google Meet criado:', data);
        return data.hangoutLink; 
    } catch (error) {
        console.error('Erro ao criar evento do Google Meet:', error);
        return null;
    }
}
