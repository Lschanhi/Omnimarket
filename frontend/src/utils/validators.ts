import type { CadastroFormData, FormErrors } from "../types/cadastroFormData";
import type { LoginErrors, LoginFormData } from "../types/LoginFormData";

const CAMPOS_ENDERECO_CADASTRO: Array<
  | "enderecoNome"
  | "enderecoNumero"
  | "enderecoComplemento"
  | "enderecoCep"
  | "enderecoCidade"
  | "enderecoUf"
> = [
  "enderecoNome",
  "enderecoNumero",
  "enderecoComplemento",
  "enderecoCep",
  "enderecoCidade",
  "enderecoUf",
];

export function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarCpf(cpf: string) {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

export function validarCnpj(cnpj: string) {
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
}

function temConteudoNoEndereco(formData: CadastroFormData) {
  return CAMPOS_ENDERECO_CADASTRO.some((campo) => formData[campo].trim() !== "");
}

export function validarFormulario(formData: CadastroFormData): FormErrors {
  const errors: FormErrors = {};

  if (!formData.nomeCompleto.trim()) {
    errors.nomeCompleto = "Informe seu nome completo.";
  }

  if (!formData.email.trim()) {
    errors.email = "Informe seu email.";
  } else if (!validarEmail(formData.email)) {
    errors.email = "Digite um email valido.";
  }

  if (!formData.senha) {
    errors.senha = "Informe uma senha.";
  } else if (formData.senha.length < 6) {
    errors.senha = "A senha precisa ter no minimo 6 caracteres.";
  }

  if (!formData.confirmarSenha) {
    errors.confirmarSenha = "Confirme sua senha.";
  } else if (formData.senha !== formData.confirmarSenha) {
    errors.confirmarSenha = "As senhas precisam coincidir.";
  }

  if (!formData.cpf.trim()) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validarCpf(formData.cpf)) {
    errors.cpf = "Digite um CPF no formato 000.000.000-00.";
  }

  if (!formData.telefone.trim()) {
    errors.telefone = "Informe seu telefone.";
  }

  if (!formData.dataNascimento) {
    errors.dataNascimento = "Informe sua data de nascimento.";
  }

  if (!formData.aceitouTermosUso) {
    errors.aceitouTermosUso = "Aceite o termo de uso para continuar.";
  }

  if (formData.tipoCadastro === "vendedor") {
    if (!formData.nomeFantasia.trim()) {
      errors.nomeFantasia = "Informe o nome fantasia da loja.";
    }

    if (!formData.documentoFiscalLoja.trim()) {
      errors.documentoFiscalLoja = "Informe o documento fiscal da loja.";
    } else if (
      formData.tipoDocumentoFiscalLoja === "2"
        ? !validarCnpj(formData.documentoFiscalLoja)
        : !validarCpf(formData.documentoFiscalLoja)
    ) {
      errors.documentoFiscalLoja =
        formData.tipoDocumentoFiscalLoja === "2"
          ? "Digite um CNPJ no formato 00.000.000/0000-00."
          : "Digite um CPF no formato 000.000.000-00.";
    }

    if (!formData.aceitouTermoFiscalResponsabilidade) {
      errors.aceitouTermoFiscalResponsabilidade =
        "Confirme que voce esta ciente das responsabilidades fiscais para vender.";
    }
  }

  if (formData.tipoCadastro === "vendedor" || temConteudoNoEndereco(formData)) {
    if (!formData.enderecoNome.trim()) {
      errors.enderecoNome = "Informe o nome do endereco.";
    }

    if (!formData.enderecoNumero.trim()) {
      errors.enderecoNumero = "Informe o numero do endereco.";
    }

    if (!formData.enderecoCep.trim()) {
      errors.enderecoCep = "Informe o CEP do endereco.";
    } else if (!/^\d{5}-\d{3}$/.test(formData.enderecoCep)) {
      errors.enderecoCep = "Digite um CEP no formato 00000-000.";
    }

    if (!formData.enderecoCidade.trim()) {
      errors.enderecoCidade = "Informe a cidade do endereco.";
    }

    if (!formData.enderecoUf.trim()) {
      errors.enderecoUf = "Informe a UF do endereco.";
    } else if (formData.enderecoUf.trim().length !== 2) {
      errors.enderecoUf = "A UF deve ter 2 letras.";
    }
  }

  return errors;
}

export function validarLogin(formData: LoginFormData): LoginErrors {
  const errors: LoginErrors = {};

  if (!formData.email.trim()) {
    errors.email = "Informe seu email.";
  } else if (!validarEmail(formData.email)) {
    errors.email = "Digite um email valido.";
  }

  if (!formData.senha.trim()) {
    errors.senha = "Informe sua senha.";
  }

  return errors;
}
