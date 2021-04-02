import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const formatDateToPtBr = (date: string, hasTime = false) => {
  if (!date) return '';

  const template = hasTime ? "'dd MMM yyyy', às 'HH':'mm" : 'dd MMM yyyy';

  return format(new Date(date), template, {
    locale: ptBR,
  });
};
