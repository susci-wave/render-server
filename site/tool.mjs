import path from 'path'
import {fileURLToPath} from 'url'

export function getDir(url){
  return path.dirname(fileURLToPath(url))
}
