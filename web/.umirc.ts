import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  history: {
    type: 'hash',
  },
  // https: {
  //   cert: 'server.crt',
  //   key: 'server.key',
  //   hosts: ['127.0.0.1', 'localhost', 'aiverse.me'],
  // },
  mfsu: false,
  model: {},
  initialState: {},
  proxy: {
    '/graphql': {
      target: 'http://10.243.248.69:3000/graphql/',
      changeOrigin: true,
      pathRewrite: { '^/graphql': '' },
    },
    '/finetune': {
      target: 'http://10.243.248.69:3000/',
      changeOrigin: true,
    },
  },
  request: {},
  // layout: {
  //   title: 'AIVERSE',
  // },
  locale: {
    baseNavigator: false,
    default: 'en-US',
    baseSeparator: '-',
  },
  routes: [
    {
      path: '/',
      component: './index',
    },
    // {
    //   path: '/collection',
    //   component: './collection',
    //   name: 'Collection',
    // },
    {
      path: '/readme',
      component: './readme',
      name: 'Readme',
    },
    {
      path: '/about',
      component: './about',
      name: 'About',
    },
    {
      path: '/privacy-policy',
      component: './about/privacy-policy',
      name: 'PrivacyPolicy',
    },
    {
      path: '/gallery',
      component: './gallery',
      name: 'Gallery',
    },
    {
      path: '/universe/parallel',
      component: './universe/parallel',
      name: 'Parallel',
    },
    {
      path: '/universe/parallel/portal',
      component: './universe/parallel/portal',
      name: 'Portal',
    },
    {
      path: '/universe/creative',
      component: './universe/creative',
      name: 'Creation',
    },
    {
      path: '/universe/customized',
      component: './universe/customized',
      name: 'Customized',
    },
    {
      path: '/features/workshop',
      component: './features/workshop',
    },
    { path: '/features/figure', component: './features/figure' },
    { path: '/features/style-model', component: './features/style' },
    { path: '/features/ai-product', component: './features/product' },
    { path: '/features/ai-model', component: './features/model' },
    { path: '/features/group-photo', component: './features/group-photo' },
    {
      path: '/user',
      component: './user',
      name: 'User',
    },
    // {
    //   path: '/activity',
    //   component: './activity',
    //   name: 'Activity',
    // },
    // {
    //   path: '/activity/KNN3',
    //   component: './activity/knn3',
    //   name: 'KNN3',
    // },
    // {
    //   path: '/activity/NEO',
    //   component: './activity/neo',
    //   name: 'NEO',
    // },
    // {
    //   path: '/activity/BASE_TXT2IMG',
    //   component: './activity/txt2img',
    //   name: 'Txt2img',
    // },
    {
      path: '/auth/:type',
      component: './auth',
    },
    {
      redirect: '/',
    },
  ],
  npmClient: 'yarn',
  publicPath: process.env.NODE_ENV === 'development' ? '/' : './',
});
