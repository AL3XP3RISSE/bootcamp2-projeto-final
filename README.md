## Colaboradores & Funções 
| Nome | RA | GitHub User | Função | Link PR |
| --- | --- | --- | --- | --- |
| Alex Machado Generoso Perissê | _RA:22610844_ | [Alex Github User](https://github.com/AL3XP3RISSE) | Persistência | [PR Alex](https://github.com/AL3XP3RISSE/bootcamp2-projeto-final/pulls?q=is%3Apr+state%3Aclosed+author%3AAL3XP3RISSE) |
| Arthur Bradley Barroca | _RA:22603901_ | [Arthur Github User](https://github.com/Arthur-Bradley-Barroca) | DockerHub | [PR Arthur]() |
| Giovanna Martins da Silva | _RA:22610329_ | [Giovanna Github User](https://github.com/giihmartins) | Frontend | [PR Giovanna](https://github.com/AL3XP3RISSE/bootcamp2-projeto-final/pulls?q=is%3Apr+state%3Aclosed+author%3Agiihmartins) |
| Glauber Oliveira | _RA:22601400_ | [Glauber Github User](https://github.com/glauberoliveirabr) | Teste JavaScript | [Pr Glauber](https://github.com/AL3XP3RISSE/bootcamp2-projeto-final/pulls?q=is%3Apr+state%3Aclosed+author%3Aglauberoliveirabr) |
| Luis Ernane Oliveira de Alencar | _RA:22601006_ | [Luis Github User](https://github.com/luisernane-cell) | Aplicação da API | [PR Luis](https://github.com/AL3XP3RISSE/bootcamp2-projeto-final/pulls?q=is%3Apr+state%3Aclosed+author%3Aluisernane-cell) |

## Aplicação
•⁠  ⁠*Descrição da Aplicação:*
•⁠  ⁠*API Escolhida:*
•⁠  ⁠*Banco de Dados Utilizado:*

## Testes

[Imagens De Testes](./docsevidencias)

## Links
•⁠  ⁠*Link do Repositório GitHub:* [Acesse aqui o Repositório.](https://github.com/AL3XP3RISSE/bootcamp2-projeto-final)


## Como rodar com Docker

Imagem pública no Docker Hub: [arthurbarroca/raiz-do-nome](https://hub.docker.com/r/arthurbarroca/raiz-do-nome)

```bash
docker run -d -p 8080:80 --name raiz-do-nome arthurbarroca/raiz-do-nome:etapa03
```

Depois, abra http://localhost:8080. Para parar e remover o container:

```bash
docker rm -f raiz-do-nome
```

A imagem usa Nginx Alpine com compressão gzip, cabeçalhos de segurança e healthcheck, e roda em computadores Intel e Apple Silicon.