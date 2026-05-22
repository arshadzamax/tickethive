import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = useDispatch
export const useAppSelector = useSelector as TypedUseSelectorHook<RootState>
