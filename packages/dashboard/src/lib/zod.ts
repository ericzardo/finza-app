import { z } from 'zod/v4'
import pt from 'zod/v4/locales/pt.js'

z.config({
  ...pt(),
  customError: (issue) => {
    switch (issue.code) {
      case 'too_small': {
        if (issue.origin === 'string') {
          if (issue.minimum === 1) return 'Campo obrigatório'
          return `Mínimo de ${issue.minimum} caracteres`
        }
        break
      }
      case 'too_big': {
        if (issue.origin === 'string') {
          return `Máximo de ${issue.maximum} caracteres`
        }
        break
      }
      case 'invalid_format': {
        if (issue.format === 'email') {
          return 'Informe um e-mail válido'
        }
        break
      }
      case 'invalid_type': {
        if (issue.input === undefined) {
          return 'Campo obrigatório'
        }
        break
      }
    }

    return undefined
  },
})
