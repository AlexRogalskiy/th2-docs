// @ts-ignore
import colors, {Colors} from 'vuetify/lib/util/colors'
import {UserVuetifyPreset} from "vuetify/types/services/presets";

const vuetifyColors: Colors = colors

const exactproColors = {
  main: {
    turquoise: {
      base: '#3f979f',
      lighten1: '#78b6bc',
      lighten2: '#b2d5d9',
      lighten3: '#d9eaec'
    },
    navyBlue: {
      base: '#1e2736',
      lighten1: '#616772',
      lighten2: '#a5a9af',
      lighten3: '#d2d4d7'
    }
  },
  extra: {
    blue:{
      base: '#5293c9',
      lighten1: '#83b2d8',
      lighten2: '#b9d3e9',
      lighten3: '#dce9f4'
    },
    red:{
      base: '#b64c4c',
      lighten1: '#dba7a7',
      lighten2: '#e2b7b7',
      lighten3: '#f0dbdb'
    }
  }
}

const config: UserVuetifyPreset = {
  customVariables: ['~/assets/variables.scss'],
  theme: {
    dark: false,
    //options: { customProperties: true },
    themes: {
      light: {
        primary: exactproColors.main.turquoise.base,
        accent:  vuetifyColors.grey.darken2,
        secondary: exactproColors.main.navyBlue.base,
        info: exactproColors.extra.blue.base,
        warning: vuetifyColors.amber.base,
        error: exactproColors.extra.red.base,
        success: vuetifyColors.green.accent3
      },
      dark: {
        primary: exactproColors.main.turquoise.base,
        accent:  vuetifyColors.grey.darken3,
        secondary: exactproColors.main.navyBlue.base,
        info: exactproColors.extra.blue.base,
        warning: vuetifyColors.amber.base,
        error: exactproColors.extra.red.base,
        success: vuetifyColors.green.accent3
      }
    }
  }
}

export default config
