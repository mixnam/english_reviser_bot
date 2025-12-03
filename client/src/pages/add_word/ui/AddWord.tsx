import {useSearchParams} from 'react-router-dom'
import {List, Button, Textarea, Title,  Caption, IconButton} from '@telegram-apps/telegram-ui'
import React, { useEffect, useState } from 'react'
import { useCheckSimilarWorkQuery } from '../api/checkSimilarWords'
import { useGetExamplesQuery } from '../api/getExamples';
import { useSubmitWordMutation } from '../api/submitWord';
import WebApp from '@twa-dev/sdk';
import { ReloadIcon } from './ReloadIcon';

let timeout: number;

const debounce = (callback: () => void, time: number) => () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback(), time)
}

export const AddWord = () => {
    const [searchParams]= useSearchParams()
    const chatIDParam = searchParams.get('chat_id')

    const [word, setWord] = useState("")
    const [translation, setTranslation] = useState("")
    const [example, setExample] = useState("")

    const checkSimilarWordQuery = useCheckSimilarWorkQuery({chatID: chatIDParam ?? "", word })
    const getExamplesQuery = useGetExamplesQuery({chatID: chatIDParam ?? "", word, translation})
    const submitWordMutation = useSubmitWordMutation() 

    const checkSimilarWordDebounced = debounce(() => checkSimilarWordQuery.refetch(), 1000)

    const onChangeWord = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.currentTarget.value
        setWord(value)
        if (value) {
            checkSimilarWordDebounced()
        }
    }

    const onChangeTranslation = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.currentTarget.value
        setTranslation(value)
    }

    const onChangeExample = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setExample(e.currentTarget.value)
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        submitWordMutation.mutate({
            chatID: chatIDParam ?? '',
            word,
            translation,
            example
        }, {
            onSuccess: () => {
                WebApp.close()
            }
        })
    }

    useEffect(() => {
        if (getExamplesQuery.data) {
            setExample(getExamplesQuery.data.example)
        }
    }, [getExamplesQuery.data])

    const isPending = checkSimilarWordQuery.isFetching || getExamplesQuery.isFetching

    return (
      <form onSubmit={onSubmit}>
        <Title className="text-center pb-5" level="1" weight="2">
          Add new word
        </Title>
        <List>
          <Textarea
            name='english' 
            header={i18n.word}
            onChange={onChangeWord}
            disabled={isPending}
          />
          <Textarea 
            name='translation'
            header={i18n.translation} 
            onChange={onChangeTranslation}
            disabled={isPending}
          />
          <Textarea 
                name='examples'
                header={i18n.examples} 
                disabled={isPending}
                value={example}
                onChange={onChangeExample}
            />
          <div className="flex items-center justify-between px-[22px] pb-2 -mt-5">
            <Caption>Generate example</Caption>
            <IconButton 
                    size="s"
                    mode="plain"
                    onClick={() =>
                    getExamplesQuery.refetch()
                }>
              <ReloadIcon size={18}/>
            </IconButton>
          </div>
          <Button 
            type='submit' 
            stretched
            loading={isPending}
            >
            {i18n.save}
          </Button>
        </List>
      </form>
    ) 
}
