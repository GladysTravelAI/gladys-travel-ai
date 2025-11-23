import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Activity_Key {
  id: UUIDString;
  __typename?: 'Activity_Key';
}

export interface CreatePrivateTripForUserData {
  trip_insert: Trip_Key;
}

export interface CreatePrivateTripForUserVariables {
  name: string;
  destination: string;
  startDate: DateString;
  endDate: DateString;
  description?: string | null;
}

export interface CreatePublicTripData {
  trip_insert: Trip_Key;
}

export interface CreatePublicTripVariables {
  name: string;
  destination: string;
  startDate: DateString;
  endDate: DateString;
  description?: string | null;
}

export interface Destination_Key {
  id: UUIDString;
  __typename?: 'Destination_Key';
}

export interface GetPrivateTripsForUserData {
  trips: ({
    id: UUIDString;
    name: string;
    destination: string;
    startDate: DateString;
    endDate: DateString;
    description?: string | null;
  } & Trip_Key)[];
}

export interface GetPublicTripsData {
  trips: ({
    id: UUIDString;
    name: string;
    destination: string;
    startDate: DateString;
    endDate: DateString;
    description?: string | null;
  } & Trip_Key)[];
}

export interface Hotel_Key {
  id: UUIDString;
  __typename?: 'Hotel_Key';
}

export interface TripActivity_Key {
  tripId: UUIDString;
  activityId: UUIDString;
  __typename?: 'TripActivity_Key';
}

export interface Trip_Key {
  id: UUIDString;
  __typename?: 'Trip_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreatePublicTripRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicTripVariables): MutationRef<CreatePublicTripData, CreatePublicTripVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePublicTripVariables): MutationRef<CreatePublicTripData, CreatePublicTripVariables>;
  operationName: string;
}
export const createPublicTripRef: CreatePublicTripRef;

export function createPublicTrip(vars: CreatePublicTripVariables): MutationPromise<CreatePublicTripData, CreatePublicTripVariables>;
export function createPublicTrip(dc: DataConnect, vars: CreatePublicTripVariables): MutationPromise<CreatePublicTripData, CreatePublicTripVariables>;

interface GetPublicTripsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicTripsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicTripsData, undefined>;
  operationName: string;
}
export const getPublicTripsRef: GetPublicTripsRef;

export function getPublicTrips(): QueryPromise<GetPublicTripsData, undefined>;
export function getPublicTrips(dc: DataConnect): QueryPromise<GetPublicTripsData, undefined>;

interface CreatePrivateTripForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePrivateTripForUserVariables): MutationRef<CreatePrivateTripForUserData, CreatePrivateTripForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePrivateTripForUserVariables): MutationRef<CreatePrivateTripForUserData, CreatePrivateTripForUserVariables>;
  operationName: string;
}
export const createPrivateTripForUserRef: CreatePrivateTripForUserRef;

export function createPrivateTripForUser(vars: CreatePrivateTripForUserVariables): MutationPromise<CreatePrivateTripForUserData, CreatePrivateTripForUserVariables>;
export function createPrivateTripForUser(dc: DataConnect, vars: CreatePrivateTripForUserVariables): MutationPromise<CreatePrivateTripForUserData, CreatePrivateTripForUserVariables>;

interface GetPrivateTripsForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPrivateTripsForUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPrivateTripsForUserData, undefined>;
  operationName: string;
}
export const getPrivateTripsForUserRef: GetPrivateTripsForUserRef;

export function getPrivateTripsForUser(): QueryPromise<GetPrivateTripsForUserData, undefined>;
export function getPrivateTripsForUser(dc: DataConnect): QueryPromise<GetPrivateTripsForUserData, undefined>;

