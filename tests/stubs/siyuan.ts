export function showMessage() {}
export function fetchPost(
  _url: string,
  _data: unknown,
  callback?: (data: unknown) => void,
) {
  callback?.({
    code: 0,
    data: [],
  })
}
export function fetchSyncPost() {
  return Promise.resolve({
    code: 0,
    data: [],
  })
}
export class Plugin {}
