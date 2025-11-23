const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'gladys-travel-ai',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createPublicTripRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePublicTrip', inputVars);
}
createPublicTripRef.operationName = 'CreatePublicTrip';
exports.createPublicTripRef = createPublicTripRef;

exports.createPublicTrip = function createPublicTrip(dcOrVars, vars) {
  return executeMutation(createPublicTripRef(dcOrVars, vars));
};

const getPublicTripsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicTrips');
}
getPublicTripsRef.operationName = 'GetPublicTrips';
exports.getPublicTripsRef = getPublicTripsRef;

exports.getPublicTrips = function getPublicTrips(dc) {
  return executeQuery(getPublicTripsRef(dc));
};

const createPrivateTripForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePrivateTripForUser', inputVars);
}
createPrivateTripForUserRef.operationName = 'CreatePrivateTripForUser';
exports.createPrivateTripForUserRef = createPrivateTripForUserRef;

exports.createPrivateTripForUser = function createPrivateTripForUser(dcOrVars, vars) {
  return executeMutation(createPrivateTripForUserRef(dcOrVars, vars));
};

const getPrivateTripsForUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPrivateTripsForUser');
}
getPrivateTripsForUserRef.operationName = 'GetPrivateTripsForUser';
exports.getPrivateTripsForUserRef = getPrivateTripsForUserRef;

exports.getPrivateTripsForUser = function getPrivateTripsForUser(dc) {
  return executeQuery(getPrivateTripsForUserRef(dc));
};
