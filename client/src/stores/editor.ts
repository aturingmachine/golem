import type { EditorCompileError, EditorCompileResult } from '@/models/client-ast';
import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

interface EditorState {
  status: 'LOADING' | 'ERROR' | 'SUCCESS'
  results: (EditorCompileResult | EditorCompileError)[]
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    status: 'SUCCESS',
    results: [],
  }),

  getters: {
    latest(): EditorCompileResult | EditorCompileError | undefined {
      return this.results[this.results.length - 1]
    }
  },

  actions: {
    async parse(raw: string) {
      console.log(`attempting to parse:\n${raw}\n`)

      try {
        const response = await Http.post<EditorCompileResult>('/ast/parse', { script: raw })

        console.log(response)

        this.results.push(response)
      } catch (error: any) {
        console.error(error)

        this.results.push({ message: error.message, error })
      }
    }
  }
})
