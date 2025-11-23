import { CreatePublicTripData, CreatePublicTripVariables, GetPublicTripsData, CreatePrivateTripForUserData, CreatePrivateTripForUserVariables, GetPrivateTripsForUserData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreatePublicTrip(options?: useDataConnectMutationOptions<CreatePublicTripData, FirebaseError, CreatePublicTripVariables>): UseDataConnectMutationResult<CreatePublicTripData, CreatePublicTripVariables>;
export function useCreatePublicTrip(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePublicTripData, FirebaseError, CreatePublicTripVariables>): UseDataConnectMutationResult<CreatePublicTripData, CreatePublicTripVariables>;

export function useGetPublicTrips(options?: useDataConnectQueryOptions<GetPublicTripsData>): UseDataConnectQueryResult<GetPublicTripsData, undefined>;
export function useGetPublicTrips(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicTripsData>): UseDataConnectQueryResult<GetPublicTripsData, undefined>;

export function useCreatePrivateTripForUser(options?: useDataConnectMutationOptions<CreatePrivateTripForUserData, FirebaseError, CreatePrivateTripForUserVariables>): UseDataConnectMutationResult<CreatePrivateTripForUserData, CreatePrivateTripForUserVariables>;
export function useCreatePrivateTripForUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePrivateTripForUserData, FirebaseError, CreatePrivateTripForUserVariables>): UseDataConnectMutationResult<CreatePrivateTripForUserData, CreatePrivateTripForUserVariables>;

export function useGetPrivateTripsForUser(options?: useDataConnectQueryOptions<GetPrivateTripsForUserData>): UseDataConnectQueryResult<GetPrivateTripsForUserData, undefined>;
export function useGetPrivateTripsForUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetPrivateTripsForUserData>): UseDataConnectQueryResult<GetPrivateTripsForUserData, undefined>;
