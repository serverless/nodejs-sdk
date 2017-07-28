const fdk = require('../index')
const eventGatewayProcesses = require('./event-gateway/processes')

const functionConfig = {
  functionId: 'hello',
  provider: {
    type: 'awslambda',
    arn: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/users',
    region: 'us-east-1',
  },
}
let eventGateway
let eventGatewayProcessId

beforeAll(() =>
  eventGatewayProcesses.spawn().then(processInfo => {
    eventGatewayProcessId = processInfo.id
    eventGateway = fdk.createEventGatewayClient({
      hostname: 'localhost',
      configurationProtocol: 'http',
      configurationPort: processInfo.configPort,
    })
  })
)

afterAll(() => {
  eventGatewayProcesses.shutDown(eventGatewayProcessId)
})

test('should return an empty list for a new gateway', () => {
  expect.assertions(1)
  return eventGateway.listFunctions().then(response => {
    expect(response).toEqual({ functions: [] })
  })
})

test('should add a function to the gateway', () => {
  expect.assertions(1)
  return eventGateway.addFunction(functionConfig).then(response => {
    expect(response).toEqual(functionConfig)
  })
})

test('should list the added function', () => {
  expect.assertions(1)
  return eventGateway.listFunctions().then(response => {
    expect(response).toEqual({ functions: [functionConfig] })
  })
})

test('should remove the added function', () => {
  expect.assertions(1)
  return eventGateway.deleteFunction({ functionId: 'hello' }).then(response => {
    expect(response).toBeUndefined()
  })
})