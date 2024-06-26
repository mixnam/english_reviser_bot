import {useMutation } from '@tanstack/react-query'
import { EditableWord } from '../model'
import {API_BASE_URL} from '../../../config'


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

