import {useMutation } from '@tanstack/react-query'
import { EditableWord } from '../model'

const API_BASE_URL = ''

export const useSaveWordMutation = () => {
    return useMutation({
        mutationFn: (word: EditableWord) => {
            return fetch(`${API_BASE_URL}/word/${word.id}`, {
                method: 'POST',
                body: JSON.stringify(word)
            })
        },
    })
}

