import { ConnectorConfig } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CRMEntityLink_Key {
  id: UUIDString;
  __typename?: 'CRMEntityLink_Key';
}

export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface GoalUpdate_Key {
  id: UUIDString;
  __typename?: 'GoalUpdate_Key';
}

export interface Goal_Key {
  id: UUIDString;
  __typename?: 'Goal_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

