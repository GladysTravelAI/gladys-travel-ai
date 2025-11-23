import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'gladys-travel-ai',
  location: 'us-central1'
};

export const createPublicTripRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePublicTrip', inputVars);
}
createPublicTripRef.operationName = 'CreatePublicTrip';

export function createPublicTrip(dcOrVars, vars) {
  return executeMutation(createPublicTripRef(dcOrVars, vars));
}

export const getPublicTripsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicTrips');
}
getPublicTripsRef.operationName = 'GetPublicTrips';

export function getPublicTrips(dc) {
  return executeQuery(getPublicTripsRef(dc));
}

export const createPrivateTripForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePrivateTripForUser', inputVars);
}
createPrivateTripForUserRef.operationName = 'CreatePrivateTripForUser';

export function createPrivateTripForUser(dcOrVars, vars) {
  return executeMutation(createPrivateTripForUserRef(dcOrVars, vars));
}

export const getPrivateTripsForUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPrivateTripsForUser');
}
getPrivateTripsForUserRef.operationName = 'GetPrivateTripsForUser';

export function getPrivateTripsForUser(dc) {
  return executeQuery(getPrivateTripsForUserRef(dc));
}

