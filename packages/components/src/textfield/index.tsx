'use client'

import React from 'react'
import {
  TextField as MUITextField,
  TextFieldProps as MUITextFieldProps,
  MenuItem as SelectOption,
  styled
} from '@mui/material'

interface AdditionalTextFieldProps {
  gutterBottom?: boolean
  selectOptions?: Array<{
    label: string | number
    value: string | number
  }>
}

export type TextFieldProps = MUITextFieldProps & AdditionalTextFieldProps

const TextFieldComponent: React.FC<TextFieldProps> = (props: TextFieldProps) => {
  const { select, selectOptions, gutterBottom, ...rest } = props
  return <MUITextField
    select={select ?? false}
    variant='standard' {...rest}>
    {selectOptions?.map(option => (
      <SelectOption key={option.value} value={option.value}>
        {option.label}
      </SelectOption>
    ))}
  </MUITextField>
}

export const TextField = styled(TextFieldComponent)<TextFieldProps>(({ gutterBottom }) => {
  const gutterButtonStyles = {
    marginBottom: '12px'
  }
  return {
    ...((gutterBottom ?? false) && gutterButtonStyles)
  }
})

export {
  SelectOption
}
