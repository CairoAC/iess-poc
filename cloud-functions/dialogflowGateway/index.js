const cors = require('cors');
const {SessionsClient} = require('@google-cloud/dialogflow-cx');

const corsHandler = cors({origin: true});

exports.dialogflowGateway = (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const client = new SessionsClient({ apiEndpoint: `us-central1-dialogflow.googleapis.com` });
    const sessionId = Math.random().toString(36).substring(7);
    const sessionPath = client.projectLocationAgentSessionPath(
      'iess-chatbot',
      'us-central1',
      '7064b4f8-d7d0-4d60-9fb0-d6559177500a',
      sessionId
    );

    const query = req.body.query;
    const geolocation = req.body.geolocation;

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
        },
        languageCode: 'es',
      },
      queryParams: {
        payload: {
          fields: {
            location: {
              structValue: {
                fields: {
                  latitude: {numberValue: geolocation.latitude},
                  longitude: {numberValue: geolocation.longitude},
                },
              },
              kind: "structValue"
            }
          }
        }
      }
    };

    console.log("Latitude:", geolocation.latitude);
    console.log("Longitude:", geolocation.longitude);


    try {
      const [response] = await client.detectIntent(request);
      console.log(response);

      if (!response.queryResult) {
        res.status(500).json({ error: "Não contém um queryResult" });
        return;
      }

      const messages = response.queryResult.responseMessages?.map(msg => msg.text?.text).filter(Boolean);
      res.status(200).json({ messages });
    } catch (error) {
      console.error('Erro ao acessar o Dialogflow CX:', error);
      res.status(500).json({ error: 'Erro ao se conectar ao Dialogflow CX' });
    }
  });
};