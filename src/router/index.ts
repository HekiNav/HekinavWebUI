import { createRouter, createWebHistory } from 'vue-router'
import FrontPage from '../pages/FrontPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'frontPage',
      component: FrontPage,
    },
    {
      path: '/nav',
      name: 'routing',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/RoutingPage.vue'),
    },
    {
      path: '/map',
      name: 'linemap',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/LineMapPage.vue'),
    },
    {
      path: '/changelog',
      name: 'changelog',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/ChangelogPage.vue'),
    },
    {
      path: '/discord',
      name: 'discord',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/DiscordPAge.vue'),
    },
    {
      path: '/tools',
      name: 'tools',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/ToolsPage.vue'),
    },
  ],
})

export default router
