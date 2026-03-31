import { create } from 'zustand'

interface FileSystemState {
  directoryHandle: FileSystemDirectoryHandle | null
  rootName: string | null
  openFilePath: string | null
  openFileContent: string | null
  isDirty: boolean
}

interface FileSystemActions {
  setDirectoryHandle: (handle: FileSystemDirectoryHandle) => void
  readFile: (relativePath: string) => Promise<string | null>
  openFile: (relativePath: string) => Promise<boolean>
  saveFile: () => Promise<boolean>
  writeFile: (relativePath: string, content: string) => Promise<boolean>
  createFile: (relativePath: string, content?: string) => Promise<boolean>
  deleteFile: (relativePath: string) => Promise<boolean>
  setOpenFileContent: (content: string) => void
  closeFile: () => void
  clearDirectory: () => void
}

async function resolveParent(
  root: FileSystemDirectoryHandle,
  segments: string[],
  create: boolean,
): Promise<FileSystemDirectoryHandle> {
  let current = root
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create })
  }
  return current
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '.vite', 'coverage'])

/** Try exact path, then recursively search subdirectories (max 3 levels deep) */
async function tryReadFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<{ content: string; resolvedPath: string } | null> {
  const segments = relativePath.split('/').filter(Boolean)

  // Attempt 1: exact path from root
  try {
    const parentDir = await resolveParent(root, segments.slice(0, -1), false)
    const fileHandle = await parentDir.getFileHandle(segments[segments.length - 1])
    const file = await fileHandle.getFile()
    return { content: await file.text(), resolvedPath: relativePath }
  } catch {
    // exact path failed
  }

  // Attempt 2: recursive search in subdirectories
  return searchInSubdirs(root, segments, '', 0)
}

async function searchInSubdirs(
  dir: FileSystemDirectoryHandle,
  segments: string[],
  prefix: string,
  depth: number,
): Promise<{ content: string; resolvedPath: string } | null> {
  if (depth > 3) return null

  try {
    for await (const entry of dir.values()) {
      if (entry.kind !== 'directory') continue
      if (SKIP_DIRS.has(entry.name)) continue

      const subDir = await dir.getDirectoryHandle(entry.name)
      const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name

      // Try resolving the full path from this subdirectory
      try {
        const parentDir = await resolveParent(subDir, segments.slice(0, -1), false)
        const fileHandle = await parentDir.getFileHandle(segments[segments.length - 1])
        const file = await fileHandle.getFile()
        return {
          content: await file.text(),
          resolvedPath: `${subPrefix}/${segments.join('/')}`,
        }
      } catch {
        // not here, recurse deeper
      }

      const found = await searchInSubdirs(subDir, segments, subPrefix, depth + 1)
      if (found) return found
    }
  } catch {
    // iteration failed
  }

  return null
}

export const useFileSystemStore = create<FileSystemState & FileSystemActions>(
  (set, get) => ({
    directoryHandle: null,
    rootName: null,
    openFilePath: null,
    openFileContent: null,
    isDirty: false,

    setDirectoryHandle: (handle) =>
      set({ directoryHandle: handle, rootName: handle.name }),

    readFile: async (relativePath) => {
      const { directoryHandle } = get()
      if (!directoryHandle) return null

      const result = await tryReadFile(directoryHandle, relativePath)
      return result?.content ?? null
    },

    openFile: async (relativePath) => {
      const { directoryHandle } = get()
      if (!directoryHandle) return false

      const result = await tryReadFile(directoryHandle, relativePath)
      if (!result) return false

      set({
        openFilePath: result.resolvedPath,
        openFileContent: result.content,
        isDirty: false,
      })
      return true
    },

    saveFile: async () => {
      const { directoryHandle, openFilePath, openFileContent } = get()
      if (!directoryHandle || !openFilePath || openFileContent === null) return false

      try {
        const segments = openFilePath.split('/').filter(Boolean)
        const parentDir = await resolveParent(
          directoryHandle,
          segments.slice(0, -1),
          false,
        )
        const fileHandle = await parentDir.getFileHandle(segments[segments.length - 1])
        const writable = await fileHandle.createWritable()
        await writable.write(openFileContent)
        await writable.close()
        set({ isDirty: false })
        return true
      } catch {
        return false
      }
    },

    writeFile: async (relativePath, content) => {
      const { directoryHandle } = get()
      if (!directoryHandle) return false

      try {
        const segments = relativePath.split('/').filter(Boolean)
        const parentDir = await resolveParent(
          directoryHandle,
          segments.slice(0, -1),
          false,
        )
        const fileHandle = await parentDir.getFileHandle(segments[segments.length - 1])
        const writable = await fileHandle.createWritable()
        await writable.write(content)
        await writable.close()
        return true
      } catch {
        return false
      }
    },

    createFile: async (relativePath, content = '') => {
      const { directoryHandle } = get()
      if (!directoryHandle) return false

      try {
        const segments = relativePath.split('/').filter(Boolean)
        const parentDir = await resolveParent(
          directoryHandle,
          segments.slice(0, -1),
          true,
        )
        const fileHandle = await parentDir.getFileHandle(
          segments[segments.length - 1],
          { create: true },
        )
        const writable = await fileHandle.createWritable()
        await writable.write(content)
        await writable.close()
        return true
      } catch {
        return false
      }
    },

    deleteFile: async (relativePath) => {
      const { directoryHandle } = get()
      if (!directoryHandle) return false

      try {
        const segments = relativePath.split('/').filter(Boolean)
        const parentDir = await resolveParent(
          directoryHandle,
          segments.slice(0, -1),
          false,
        )
        await parentDir.removeEntry(segments[segments.length - 1])

        // Close file if it was open
        if (get().openFilePath === relativePath) {
          set({ openFilePath: null, openFileContent: null, isDirty: false })
        }
        return true
      } catch {
        return false
      }
    },

    setOpenFileContent: (content) =>
      set({ openFileContent: content, isDirty: true }),

    closeFile: () =>
      set({ openFilePath: null, openFileContent: null, isDirty: false }),

    clearDirectory: () =>
      set({
        directoryHandle: null,
        rootName: null,
        openFilePath: null,
        openFileContent: null,
        isDirty: false,
      }),
  }),
)
