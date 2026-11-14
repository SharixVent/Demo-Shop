import React from "react";
import './Loader.css'

export const Loader: React.FC = () => {

	return (
		<div className='container-loader'>
			<div className='loader'>
				<div className="dot-1"></div>
				<div className="dot-2"></div>
				<div className="dot-3"></div>
			</div>
		</div>
	)

}

export default Loader;