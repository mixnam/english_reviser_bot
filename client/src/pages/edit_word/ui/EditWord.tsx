import {useSearchParams} from 'react-router-dom'
import {List, Input, Button} from '@telegram-apps/telegram-ui'
import { EditableWord } from '../model'
import { useSaveWordMutation } from '../api/saveWord'
import React from 'react'

export const EditWord = () => {
    const [searchParams]= useSearchParams()
    const wordParam = searchParams.get('word')
    const word: EditableWord = wordParam ? JSON.parse(atob(wordParam)) : {}

    const saveWordMutation = useSaveWordMutation() 

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const englishValue = (e.currentTarget.elements.namedItem('english') as HTMLInputElement).value
        const translationValue = (e.currentTarget.elements.namedItem('translation') as HTMLInputElement).value
        const examplesValue = (e.currentTarget.elements.namedItem('examples') as HTMLInputElement).value

        saveWordMutation.mutate({
            id: word.id,
            English: englishValue,
            Translation: translationValue,
            Examples: examplesValue
        })
    }

    
    return (
      <form onSubmit={onSubmit}>
        <List>
          <Input 
            name='english' 
            header='english' 
            defaultValue={word.English}
            />
          <Input name='translation' header='translation' defaultValue={word.Translation}/>
          <Input name='examples' header='examples' defaultValue={word.Examples} />
          <Button type='submit'>Save</Button>
        </List>
      </form>
    ) 
}
