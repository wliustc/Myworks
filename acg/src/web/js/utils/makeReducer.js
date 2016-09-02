/**
 * @param  {initState}
 * @param  {Object} handlers
 * @return {Reducer}
 */
export default function makeReducer(initState, handlers) {
  return function reducer(state = initState, action) {
    const handler = handlers[action.type]
    return handler ? handler(state, action) : state
  }
}
