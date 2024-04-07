exports.dialogflowWebhook = (req, res) => {
  console.log(req.body);
  const payload = req.body.fulfillmentInfo && req.body.fulfillmentInfo.tag === 'test' 
                  ? req.body.payload 
                  : undefined;

  if (payload && payload.location) {
      const latitude = payload.location.latitude;
      const longitude = payload.location.longitude;

      const responseText = `Tu ubicación actual es Latitud: ${latitude}, Longitud: ${longitude}.`;

      res.json({
          fulfillment_response: {
              messages: [{
                  text: {
                      text: [responseText]
                  }
              }]
          }
      });
  } else {
      res.json({
          fulfillment_response: {
              messages: [{
                  text: {
                      text: ["Lo siento, no pude encontrar tu ubicación."]
                  }
              }]
          }
      });
  }
};