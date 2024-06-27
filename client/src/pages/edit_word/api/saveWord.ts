import {useMutation } from '@tanstack/react-query'
import { EditableWord } from '../model'
import {API_BASE_URL} from '../../../config'

import WebApp from '@twa-dev/sdk'

export const useSaveWordMutation = () => {
    return useMutation({
        mutationFn: ({
            chatID,
            word
        }: {
            chatID: string,
            word: EditableWord
        }) => {
            return fetch(`${API_BASE_URL}/chat/${chatID}/word/${word._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Telegram-Init-Data': WebApp.initData
                },
                body: JSON.stringify(word)
            })
        },
    })
}

