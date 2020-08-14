import Vue from 'vue'
import App from './App.vue'
import less from 'less'
Vue.use(less)

new Vue({
  el: '#app',
  render: h => h(App)
})
