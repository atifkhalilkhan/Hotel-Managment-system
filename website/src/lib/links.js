// Bahar ke link (https, mailto, tel) ya website ke andar ka link?
export const isExternal = (to) => /^(https?:|mailto:|tel:)/.test(to);