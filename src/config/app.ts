interface AppConfig {
    name: string,
    github: {
        title: string,
        url: string
    },
    author: {
        name: string,
        url: string
    },
}

export const appConfig: AppConfig = {
  name: "tursim",
  github: {
    title: "tursim",
    url: "https://github.com/lachlanmacphee/tursim",
  },
  author: {
    name: "Lachlan MacPhee",
    url: "https://github.com/lachlanmacphee/",
  },
};