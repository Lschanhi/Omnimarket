function extrairDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function normalizarCep(valor: string) {
  return extrairDigitos(valor).slice(0, 8);
}

export function formatarCep(valor: string) {
  const digitos = normalizarCep(valor);

  if (digitos.length <= 5) {
    return digitos;
  }

  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

export function formatarCpf(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 11);

  if (digitos.length <= 3) {
    return digitos;
  }

  if (digitos.length <= 6) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  }

  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function formatarCnpj(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 14);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 5) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  }

  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }

  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }

  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

export function formatarCpfOuCnpj(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 14);

  return digitos.length <= 11 ? formatarCpf(digitos) : formatarCnpj(digitos);
}

export function formatarDocumentoFiscal(valor: string, tipoDocumentoFiscal?: number | string) {
  return String(tipoDocumentoFiscal) === "2" ? formatarCnpj(valor) : formatarCpf(valor);
}

export function formatarTelefone(valor: string) {
  const digitosSemPais = extrairDigitos(valor).replace(/^55(?=\d{10,11}$)/, "");
  const digitos = digitosSemPais.slice(0, 11);

  if (!digitos) {
    return "";
  }

  if (digitos.length <= 2) {
    return `(${digitos}`;
  }

  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }

  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function formatarNumeroCartao(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 19);

  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatarValidadeCartao(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 4);

  if (digitos.length <= 2) {
    return digitos;
  }

  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

export function formatarMoedaParaInput(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 15);

  if (!digitos) {
    return "";
  }

  const centavos = digitos.slice(-2).padStart(2, "0");
  const parteInteira = digitos.length > 2 ? digitos.slice(0, -2) : "0";
  const inteiroFormatado = Number(parteInteira).toLocaleString("pt-BR");

  return `${inteiroFormatado},${centavos}`;
}

export function formatarMoedaDeNumero(valor?: number, fallback = "") {
  if (typeof valor !== "number" || Number.isNaN(valor)) {
    return fallback;
  }

  return formatarMoedaParaInput(String(Math.round(valor * 100)));
}
