import type { AppDispatch, RootState } from '../app/store'

declare module 'react-redux' {
  export function useDispatch(): AppDispatch
  export interface DefaultRootState extends RootState {}
}
