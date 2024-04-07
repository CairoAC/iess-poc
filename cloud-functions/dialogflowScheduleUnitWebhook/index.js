const {Firestore} = require('@google-cloud/firestore');

const firestore = new Firestore();

exports.dialogflowScheduleUnitWebhook = async (req, res) => {

    console.log(req.body.sessionInfo.parameters);
     
    const chosenUnitName = req.body.sessionInfo.parameters.chooseunit;

    console.log("Unidade escolhida recebida:", chosenUnitName);

    if (!chosenUnitName) {
        res.json({
            fulfillment_response: {
                messages: [{
                    text: {
                        text: ["No entendí la unidad elegida. ¿Puedes repetir, por favor?"]
                    }
                }]
            }
        });
        return;
    }

    try {
        const unitSnapshot = await firestore.collection('Unidades de Atendimento').where('Name', '==', chosenUnitName).get();

        console.log("Resultado da consulta ao Firestore:", unitSnapshot.empty ? "Nenhuma unidade encontrada" : "Unidade encontrada");

        if (unitSnapshot.empty) {
            res.json({
                fulfillment_response: {
                    messages: [{
                        text: {
                            text: ["No encontré una unidad con ese nombre. Por favor, elige una unidad válida."]
                        }
                    }]
                }
            });
        } else {
            res.json({
                fulfillment_response: {
                    messages: [{
                        text: {
                            text: [`La unidad elegida fue ${chosenUnitName}. Podemos continuar con el agendamiento.`]
                        }
                    }]
                }
            });
        }
    } catch (error) {
        console.error('Erro ao buscar a unidade:', error);
        res.json({
            fulfillment_response: {
                messages: [{
                    text: {
                        text: ["Hubo un error al procesar tu elección. Por favor, intenta de nuevo."]
                    }
                }]
            }
        });
    }
};
