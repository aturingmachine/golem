import { accessSync, readdirSync, statSync } from 'fs'
import path from 'path'

export const pathExists = (path: string): boolean => {
  try {
    accessSync(path)
    return true
  } catch (error) {
    return false
  }
}

export const getAllFiles = (
  dirPath: string,
  arrayOfFiles: string[]
): string[] => {
  const files = readdirSync(dirPath, {
    withFileTypes: false,
    encoding: 'utf-8',
  })

  let filesCopy = [...arrayOfFiles]

  files.forEach((file) => {
    if (statSync(dirPath + '/' + file).isDirectory()) {
      filesCopy = filesCopy.concat(
        getAllFiles(dirPath + '/' + file, arrayOfFiles)
      )
    } else {
      filesCopy.push(path.join(dirPath, '/', file))
    }
  })

  return filesCopy
}
