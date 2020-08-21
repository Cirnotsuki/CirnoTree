<template>
<div class="cirno-color-wrap">
	<div class="cirno-color-box">
		<div class="cirno-color-picker">
			<div
				class="cirno-color-hs"
				@mousedown="selectColor" 
			>
				<div class="cirno-color-hairs"
					:style="{
						left: posX + 'px',
						top: posY + 'px'
					}"
				>
					<svg  aria-hidden="true">
						<use xlink:href="#cirno-color-crosshairs"></use>
					</svg>
				</div>
			</div>
			<div 
				class="cirno-color-brightness" 
				:style="{backgroundColor: `hsl(${color.h}, 100%, 50%)`}"
			>
				<div class="cirno-color-slider">
					<svg  aria-hidden="true">
						<use xlink:href="#cirno-color-slider-arrow"></use>
					</svg>
					<svg  aria-hidden="true">
						<use xlink:href="#cirno-color-slider-arrow"></use>
					</svg>
				</div>
			</div>
		</div>
		<div class="cirno-color-inputer">
			<div class="row">
				<label>色相(H):</label><input type="text" v-model="color.h"><span>度</span>
			</div>
			<div class="row">
				<label>饱和度(S):</label><input type="text" v-model="color.s"><span>%</span>
			</div>
			<div class="row">
				<label>亮度(L):</label><input type="text" v-model="color.l"><span>%</span>
			</div>
			<div class="row color-16bit">
				<label>#</label><input type="text" v-model="color16">
			</div>
			<div class="row">
				<label>红(R):</label><input type="text" v-model="crgb.r">
			</div>
			<div class="row">
				<label>绿(G):</label><input type="text" v-model="crgb.g">
			</div>
			<div class="row">
				<label>蓝(B):</label><input type="text" v-model="crgb.b">
			</div>
		</div>
	</div>
	<div class="cirno-color-option">
		<div
			class="cirno-color-preview"
			:style="{backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)`}" 
		/>
	</div>
	<svg class="cirno-color-symbol" style="display: none">
		<symbol id="cirno-color-crosshairs" viewBox="0 0 1024 1024">
			<path d="M757.142857 585.142857l-62.285714 0q-14.857143 0-25.714286-10.857143t-10.857143-25.714286l0-73.142857q0-14.857143 10.857143-25.714286t25.714286-10.857143l62.285714 0q-18.285714-61.714286-64.285714-107.714286t-107.714286-64.285714l0 62.285714q0 14.857143-10.857143 25.714286t-25.714286 10.857143l-73.142857 0q-14.857143 0-25.714286-10.857143t-10.857143-25.714286l0-62.285714q-61.714286 18.285714-107.714286 64.285714t-64.285714 107.714286l62.285714 0q14.857143 0 25.714286 10.857143t10.857143 25.714286l0 73.142857q0 14.857143-10.857143 25.714286t-25.714286 10.857143l-62.285714 0q18.285714 61.714286 64.285714 107.714286t107.714286 64.285714l0-62.285714q0-14.857143 10.857143-25.714286t25.714286-10.857143l73.142857 0q14.857143 0 25.714286 10.857143t10.857143 25.714286l0 62.285714q61.714286-18.285714 107.714286-64.285714t64.285714-107.714286zm193.714286-109.714286l0 73.142857q0 14.857143-10.857143 25.714286t-25.714286 10.857143l-81.714286 0q-21.142857 92-88.285714 159.142857t-159.142857 88.285714l0 81.714286q0 14.857143-10.857143 25.714286t-25.714286 10.857143l-73.142857 0q-14.857143 0-25.714286-10.857143t-10.857143-25.714286l0-81.714286q-92-21.142857-159.142857-88.285714t-88.285714-159.142857l-81.714286 0q-14.857143 0-25.714286-10.857143t-10.857143-25.714286l0-73.142857q0-14.857143 10.857143-25.714286t25.714286-10.857143l81.714286 0q21.142857-92 88.285714-159.142857t159.142857-88.285714l0-81.714286q0-14.857143 10.857143-25.714286t25.714286-10.857143l73.142857 0q14.857143 0 25.714286 10.857143t10.857143 25.714286l0 81.714286q92 21.142857 159.142857 88.285714t88.285714 159.142857l81.714286 0q14.857143 0 25.714286 10.857143t10.857143 25.714286z" p-id="3057"/>
		</symbol>
		<symbol id="cirno-color-slider-arrow" viewBox="0 0 1024 1024">
			<path d="M391.232 991.68c-37.248 37.184-134.592 57.6-134.592-64.064V96.384c0-117.696 97.344-101.248 134.592-64l412.416 412.288a95.36 95.36 0 0 1 0 134.656l-412.416 412.352z" fill="#434343" p-id="6079"></path>
		</symbol>
	</svg>
</div>

</template>

<script>
import './style.less';
import script from './script.js';
export default {
	mixins: [script],
	data() {
		return {
			color: {
				h: 0,
				s: 100,
				l: 50,

				
			},
			crgb: {
				r: 0,
				g: 0,
				b: 0,
			},
			fromHSL: false,
			color16: 'AAAAAA',
			posX: 0,
			posY: 0,
			onInput: false
		}
	},
	watch: {
		color: {
			handler(obj) {
				Object.entries(obj).forEach(item => {
					let [key, val] = item;
					val = Number((''+val).split('.')[0].replace(/\D/g, ''));
					switch(key) {
						case 'h':
							this.color[key] = Math.min(val, 360).toFixed(0);
							break
						case 's':
							this.color[key] = Math.min(val, 100).toFixed(0);
							break
						case 'l':
							this.color[key] = Math.min(val, 100).toFixed(0);
							break
					}
					this.fromHSL = true;
					this.crgb = this.HSLtoRGB(obj.h, obj.s/100, obj.l/100);
				});
			},
			deep: true
		},
		crgb: {
			handler(obj) {
				if(this.fromHSL) {
					this.fromHSL = false;
					return;
				}
				console.log(321);
			},
			deep: true
		}
	},
}
</script>