<template>
	<div class="cirno-icon">
		<svg  aria-hidden="true" v-if="colorful">
			<use :xlink:href="`#${iconName}`"></use>
		</svg>
		<i :class="`${iconClass} ${iconName}`" v-else/>
	</div>
</template>
<script>
export default {
  name: 'cirno-icon',
  props: {
    name: {
      type: String,
      required: true
	},
	colorful: {
      type: Boolean,
      default: false
	},
	prefix: {
      type: String,
      default: ''
	},
	iconClass: {
      type: String,
      default: ''
	},
  },
  computed: {
	  iconName() {
		  return this.prefix.length > 0 ? `${this.prefix}-${this.name}` : this.name;
	  }

  }
}
</script>

<style lang="less">
.cirno-icon {
	position: relative;
	display: inline-block;
	font-size: 20px;
	svg{
		font-size: inherit;
		width: 1em;
		height: 1em;
		vertical-align: -0.15em;
		fill: currentColor;
		overflow: hidden;
	}
	i{
		font-size: inherit;
	}
}
</style>