// parse PLATEAU CityGML
export {PGML}
class PGML {
parse_bldg(doc) {
	const bound = {min:this.parseaxis(this.getxml(doc,"gml:boundedBy/gml:lowerCorner")[0])[0],
		max:this.parseaxis(this.getxml(doc,"gml:boundedBy/gml:upperCorner")[0])[0]}
	bound.center = [(bound.min[0]+bound.max[0])/2,(bound.min[1]+bound.max[1])/2,(bound.min[2]+bound.max[2])/2]
	const m = doc.getElementsByTagName("core:cityObjectMember")
	this.raw = m 
	const o = []
	let lod1poly = 0 
	let lod2poly = 0
	let lod2count = 0 
	let el 
	for(let i=0;i<m.length;i++) {
		el = {idx:i} 
		// get metadata
		const attr = this.getxml(m[i],"bldg:Building/gen:stringAttribute/gen:value")[0]
		const at = {id:attr.attr["gml:id"]}
		let bid = "" 
		at.string = attr.node.map(v=>{
			if(v.attr.name=="建物ID") bid= v.node[0] ;
			return {name:v.attr.name,value:v.node[0]}
		})
		at.bid = bid 
		const addr = this.getxml(m[i],"bldg:address/xAL:LocalityName")[0]
		if(addr) at.addr = addr[0] 
		const roof = this.getxml(m[i],"uro:buildingRoofEdgeArea")
		if(roof) at.buildingRoofEdgeArea = roof[0]
		const zone = this.getxml(m[i],"uro:districtsAndZonesType")
		if(zone) at.districtsAndZonesType = zone[0]
		const height = this.getxml(m[i],"bldg:measuredHeight")
		if(height) at.measuredHeight = height[0]
		let name = this.getxml(m[i],"gml:name")
		if(Array.isArray(name)) name = name[0]
		if(name) at.name = name
		el["attr"] = at 
		
		//get LOD0
		let lod0 = this.getxml(m[i],"bldg:lod0RoofEdge/gml:posList")
		if(lod0.length>0) {
			if(Array.isArray(lod0[0])) lod0 = lod0[0]
			lod0 = lod0.map(x=>this.parseaxis(x))
			el["lod0"] = lod0
		}
		//get LOD1
		let lod1 = this.getxml(m[i],"bldg:lod1Solid/gml:posList")
		if(lod1.length>0) {
			lod1 = lod1[0]
			let poly = 0 
			for(let l=0;l<lod1.length;l++) {
				lod1[l] = this.parseaxis(lod1[l])
				poly += lod1[l].length-3
			}
			lod1poly += poly 
			
			el["lod1"] = {count:lod1.length,poly:poly,surface:lod1,
				bound:this.boundbox(lod1.flat())}
			
		} 
// 	else console.log(m[i])
		// get LOD2
		const lod2 = this.getxml(m[i],"bldg:lod2Solid/gml:surfaceMember")
		if(lod2.length>0) {
			el["lod2"] = {count:lod2[0].length,surfaceid:lod2[0].map(v=>v.attr['xlink:href'])}
			el["hazlod2"] = "L2"
			lod2count++ 
			if(1) {
				el.lod2.surface = {}
				const roofs = this.getxml(m[i],"bldg:RoofSurface/gml:Polygon/gml:LinearRing/gml:posList")
				const walls = this.getxml(m[i],"bldg:WallSurface/gml:Polygon/gml:LinearRing/gml:posList")
				const grounds = this.getxml(m[i],"bldg:GroundSurface/gml:Polygon/gml:LinearRing/gml:posList")
				const outers = this.getxml(m[i],"bldg:OuterCeilingSurface/gml:Polygon/gml:LinearRing/gml:posList")
				const outerf = this.getxml(m[i],"bldg:OuterFloorSurface/gml:Polygon/gml:LinearRing/gml:posList")
				const closures = this.getxml(m[i],"bldg:ClosureSurface/gml:Polygon/gml:LinearRing/gml:posList")
				const sl = []
				let poly = 0
				try{
				const parselod2 = (surface)=> {
					return surface.map(v=>{
						const ret = (v.node)?v.node[0]:v[0]
						ret.id = ret.attr['gml:id']
						delete(ret.attr)
						ret.node = ret.node.map(v=>{
							const p = this.parseaxis(v.node)
							sl.push(p)
							poly += p.length-3
							return {id:v.attr['gml:id'],poly:p}})
						return ret 
					})
				}

				if(roofs[0]) el.lod2.surface.roofs = parselod2(roofs)
				if(walls[0]) el.lod2.surface.walls = parselod2(walls)
				if(grounds[0]) el.lod2.surface.grounds = parselod2(grounds)
				if(outers[0]) el.lod2.surface.outers = parselod2(outers)
				if(outerf[0]) el.lod2.surface.outerf = parselod2(outerf)
				if(closures[0]) el.lod2.surface.closures = parselod2(closures)
				} catch(err) {console.log(err);console.log(el);console.log(m[i])}
				el.lod2.bound = this.boundbox(sl.flat())
				el.lod2.poly = poly 
				lod2poly += poly 
			}
	//		console.log(bound)
		}
		o.push(el)
	}
	const file  = {bound:bound,count:o.length,lod2count:lod2count,lod1poly:lod1poly,lod2poly:lod2poly,list:o}
	if(1) {
		// get texture data
		const tex =[]
		const texn = []
		const poly = {}
		const texe = doc.getElementsByTagName("app:ParameterizedTexture")
		for(let i=0;i<texe.length;i++) {
			const tiff = this.getxml(texe[i],"app:imageURI")
			texn.push(tiff[0])
			const uv = this.getxml(texe[i],"app:target/app:textureCoordinates")
			uv.forEach(v=>{
				const pid = v.attr.uri
				if(!poly[pid]) poly[pid] = []
				poly[pid].push({tex:i,node:v.node})
			})
		}
		file.tex = {texfile:texn,p:poly}
	}
	return file 
}

parseaxis(str) {
	const s = str.toString().split(" ")
	const r = []
	for(let i=0;i<s.length;i+=3)
	 r.push([parseFloat(s[i]),parseFloat(s[i+1]),parseFloat(s[i+2])])
	return r 
}
boundbox(ax) {
	const b = ax.reduce((a,v)=>{
		if(v[0]>a.max[0]) a.max[0] = v[0]
		if(v[1]>a.max[1]) a.max[1] = v[1]
		if(v[2]>a.max[2]) a.max[2] = v[2]
		if(v[0]<a.min[0]) a.min[0] = v[0]
		if(v[1]<a.min[1]) a.min[1] = v[1]
		if(v[2]<a.min[2]) a.min[2] = v[2]
		return a 
	},{min:[90,180,4000],max:[0,0,-100]})
	b.center = [(b.max[0]+b.min[0])/2,(b.max[1]+b.min[1])/2,(b.max[2]+b.min[2])/2]
	return b
}
getxml(doc,tagpath) {
	const tags = tagpath.split("/")
	function attr(attr) {
		const at = {}
		for(let i=0;i<attr.length;i++) at[attr[i].name] = attr[i].textContent 
		return at
	}
	function query(base,tags) {
		const tt = tags.slice()
		const sel = tt.shift()
		const ttl = tt.length 
		let tl = []
		const el = base.getElementsByTagName(sel)
		for(let i=0;i<el.length;i++) {
			if(ttl>0) {
				if(el[i].attributes.length>0)
					tl.push({attr:attr(el[i].attributes),node:query(el[i],tt)})
				else tl.push(query(el[i],tt))
			} else {
				if(el[i].attributes.length>0) 
					tl.push({attr:attr(el[i].attributes),html:el[i].innerHTML})
				else tl.push(el[i].innerHTML)
			}
		}
		return tl 
	}
	const ret = query(doc,tags)
	return ret 
}
} //PGML