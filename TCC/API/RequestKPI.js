// SDK utilizado.
const AWS = require('aws-sdk');

// Instância de objeto para gravação e leitura da tabela.
const ddb = new AWS.DynamoDB.DocumentClient();

// Data utilizada como identificador.
var date = new Date().toISOString();

// ID para leitura da tabela por data.
var ID = generateID(date);

// Parâmetros para scan da tabela.
var params = {
  ExpressionAttributeValues: {
    ':record': ID
  },
  ProjectionExpression: 'RecordID, KPI1, KPI2, KPI3, KPI4, KPI5, KPI6, KPI7, UserName',
  FilterExpression: 'contains (RecordID, :record)',
  TableName: 'KPIs'
};

// Estrutura para regra de negócio
var paramCollection = [];

// Verificação da chave de autorização.
exports.handler = (event, context, callback) => {
    if (!event.requestContext.authorizer) {
      errorResponse('Autorização não configurada', context.awsRequestId, callback);
      return;
    }

    //Timestamp para identificador da requisição.
    const recordId = date;

    // Usuário da requisição
    const username = event.requestContext.authorizer.claims['cognito:username'];

    // Como ja é conhecido o content-type, utilizando parser JSON (O correto seria verificar o tipo do conteúdo)
    const requestBody = JSON.parse(event.body);

    // Estrutura com os KPIs
    var KPI = requestBody.KPI;

    // Chamada da função da regra de negócio que envolve o cálculo dos KPIs
    var unidade = calcKPI(KPI);

    // Chamada da função para gravação das informações em tabela.
    if (KPI.p10 === 'P') // Grava em tabela calculado
    {
     recordKPI(recordId, username, unidade).then(() => {
        // Callback de resposta para a requisição da API gateway
        callback(null, {
            statusCode: 201,
            body: JSON.stringify({
                RecordID: recordId,
                KPI1: unidade[0],
                KPI2: unidade[1],
                KPI3: unidade[2],
                KPI4: unidade[3],
                KPI5: unidade[4],
                KPI6: unidade[5],
                KPI7: unidade[6],
                UserName: username,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
     }).catch((err) => {
        //console.error(err);
        // Chamada da callback com a mensagem de erro
        errorResponse(err.message, context.awsRequestId, callback);
     });
    }
    else if(KPI.p10 === 'U') // Scaneia tabela para KPIs do dia.
    {
        var kpi1 = 0, kpi2 = 0, kpi3 = 0, kpi4 = 0, kpi5 = 0, kpi6 = 0, 
        kpi7 = 0;
        
        ddb.scan(params, function(err, data){
        if(err) 
        {
         return errorResponse(err.message, context.awsRequestId, callback);   
        }
        else
        {
        data.Items.forEach(function(element, index, array) 
          {
            kpi1 += Number(element.KPI1);
            kpi2 += Number(element.KPI2);
            kpi3 += Number(element.KPI3);
            kpi4 += Number(element.KPI4);
            kpi5 += Number(element.KPI5);
            kpi6 += Number(element.KPI6);
            kpi7 += Number(element.KPI7);
          });
          kpi1 /= Number(data.Count);
          kpi2 /= Number(data.Count);
          kpi3 /= Number(data.Count);
          kpi4 /= Number(data.Count);
          kpi5 /= Number(data.Count);
          kpi6 /= Number(data.Count);
          kpi7 /= Number(data.Count);
          
         return callback(null, {
            statusCode: 201,
            body: JSON.stringify({
                RecordID: recordId,
                KPI1: kpi1,
                KPI2: kpi2,
                KPI3: kpi3,
                KPI4: kpi4,
                KPI5: kpi5,
                KPI6: kpi6,
                KPI7: kpi7,
                UserName: username,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }); 
        }
    });
    }
    else if (KPI.p10 === 'C') //Calcula os KPIs e responde.
    {
        // Callback de resposta para a requisição da API gateway
        return callback(null, { //Somente responde calculo
            statusCode: 201,
            body: JSON.stringify({
                RecordID: recordId,
                KPI1: unidade[0],
                KPI2: unidade[1],
                KPI3: unidade[2],
                KPI4: unidade[3],
                KPI5: unidade[4],
                KPI6: unidade[5],
                KPI7: unidade[6],
                UserName: username,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
    else errorResponse('Parâmetro não definido na API!', context.awsRequestId, callback);
};

// Função que retira os IDs do dia para busca.
function generateID(date){
   var i = date.indexOf('T');
    if (i !== -1)
     return date.substr(0, i);
    else
     return -1;
}

// Função com lógica das regras de negócios envolvendo os KPIs recebidos.
function calcKPI(KPI) {
    //console.log('Returning response: ', KPI.kpium, ', ', KPI.kpidois);
    paramCollection[0] = Number(KPI.p1)/Number(KPI.p2);
    paramCollection[1] = Number(KPI.p1)/Number(KPI.p3);
    paramCollection[2] = Number(KPI.p4)/31;
    paramCollection[3] = Number(KPI.p5)/31;
    paramCollection[4] = Number(KPI.p6)/Number(KPI.p9);
    paramCollection[5] = Number(KPI.p7)/Number(KPI.p9);
    paramCollection[6] = Number(KPI.p8);
    paramCollection[7] = Number(KPI.p10);
    return paramCollection;
}

//Função para gravação dos KPIs
function recordKPI(recordId, username, unidade) {
    return ddb.put({
        TableName: 'KPIs',
        Item: {
            RecordID: recordId,
            KPI1: unidade[0],
            KPI2: unidade[1],
            KPI3: unidade[2],
            KPI4: unidade[3],
            KPI5: unidade[4],
            KPI6: unidade[5],
            KPI7: unidade[6],
            UserName: username,
            //Origin: unidade[7],
        },
    }).promise();
}

//Função para formatação da mensagem de erro.
function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
