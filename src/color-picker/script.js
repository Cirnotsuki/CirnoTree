export default{
	
	computed: {
	},
	
	methods: {
		selectColor(e){
			const {layerX : targetX, layerY: tragetY, pageX: startX, pageY: startY} = e;
			const {offsetWidth: targetWidth, offsetHeight: targetHeight} = e.target;
			console.log(e);
			[this.posX, this.posY, this.hue, this.saturation] = [
				targetX,
				tragetY,
				this.posX / targetWidth * 360,
				(targetHeight - this.posY) / targetHeight
			];

			window.onmousemove = e => {
				this.posX = Math.min(Math.max(targetX + e.pageX - startX, 0), targetWidth);
				this.posY = Math.min(Math.max(tragetY + e.pageY - startY, 0), targetHeight)
				this.color.h = this.posX / targetWidth * 360;
				this.color.s = (targetHeight - this.posY) / targetHeight * 100;
				document.getSelection().removeAllRanges();
			}
			window.onmouseup = e => {
				window.onmouseup = null;
				window.onmousemove = null;
			}
		},
		/**
		*
		* @param {Number} H 色相 [0,360)
		* @param {Number} S 饱和度 [0,1]
		* @param {Number} L 亮度 [0,1]
		* @param {Boolean} stringMode 是否返回字符串模式
		*/
		HSLtoRGB(H = 0, S = 0, L = 0, stringMode = false) {
			const C = (1 - Math.abs(2 * L - 1)) * S;
			const [X, m, vRGB] = [
				C * (1 - Math.abs(((H / 60) % 2) - 1)),
				L - C / 2,
				[]
			]
			if(H >= 360) H = 0;
			
			if (H >= 0 && H < 60) {
				vRGB.push(C, X, 0)
			} else if (H >= 60 && H < 120) {
				vRGB.push(X, C, 0)
			} else if (H >= 120 && H < 180) {
				vRGB.push(0, C, X)
			} else if (H >= 180 && H < 240) {
				vRGB.push(0, X, C)
			} else if (H >= 240 && H < 300) {
				vRGB.push(X, 0, C)
			} else if (H >= 300 && H < 360) {
				vRGB.push(C, 0, X)
			}
			const [vR, vG, vB] = vRGB
			const R = (255 * (vR + m)).toFixed(0) || 0
			const G = (255 * (vG + m)).toFixed(0) || 0
			const B = (255 * (vB + m)).toFixed(0) || 0

			if (stringMode) {
				return `rgb(${R},${G},${B})`
			}
			return { r:R, g:G, b:B }
		},
				/**
		 * @description rgb转化为hsl
		 * @param {Number} R [0,255]
		 * @param {Number} G [0,255]
		 * @param {Number} B [0,255]
		 * @param {Boolean} stringMode 是否返回字符串模式
		 */
		RGBtoHSL(R = 0, G = 0, B = 0, stringMode = false) {
			// utils
			const backCycle = (num, cycle) => {
				let index = num % cycle;
				if (index < 0) {
					index += cycle;
				}
				return index;
			}
			const numberFixed = (num = 0, count = 3) => {
				return Math.floor(num * Math.pow(10, count)) / Math.pow(10, count);
			}
			const [_R, _G, _B] = [R / 255, G / 255, B / 255]
			const [Cmax, Cmin] = [Math.max(_R, _G, _B), Math.min(_R, _G, _B)]
			const V = Cmax - Cmin;
			
			let H = 0;
			if (V === 0) {
				H = 0;
			} else if (Cmax === _R) {
				H = 60 * (((_G - _B) / V) % 6);
			} else if (Cmax === _G) {
				H = 60 * ((_B - _R) / V + 2);
			} else if (Cmax === _B) {
				H = 60 * ((_R - _G) / V + 4);
			}
			
			H = Math.floor(backCycle(H, 360));
			const L = numberFixed((Cmax + Cmin) / 2);
			const S = V === 0 ? 0 : numberFixed(V / (1 - Math.abs(2 * L - 1)));

			if (stringMode) {
				return `hsl(${H},${numberFixed(100 * S)}%,${numberFixed(100 * L)}%)`;
			}
			
			return { H, S, L };
		}
	}
}