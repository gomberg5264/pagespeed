import React, { Component } from 'react'

const Marker = () => (
  <svg
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    viewBox="-5 -5 56 64"
    width="47"
    aria-labelledby="Label__score-marker">
    <title id="Label__score-marker">
      Graph label for speed score
    </title>
    <defs>
      <filter id="marker-dropshadow" x="-10%" y="-10%">
        <feGaussianBlur in="SourceAlpha" result="blur-out" stdDeviation="2"></feGaussianBlur>
        <feOffset in="blur-out" result="the-shadow" dx="0" dy="1"></feOffset>
        <feColorMatrix
          in="the-shadow"
          result="color-out"
          type="matrix"
          values="0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0 .5 0">
        </feColorMatrix>
        <feBlend in="SourceGraphic" in2="color-out" mode="normal"></feBlend>
      </filter>
    </defs>
    <g filter="url(#marker-dropshadow)">
      <path id="path-1_9_" d="M23.2,0c12.9,0,23.2,10.2,23.2,22.9c0,6.4-3.6,13.2-13,22.4L23.2,55.4L12.9,45.3 C3.6,36,0,29.2,0,22.9C0,10.2,10.4,0,23.2,0L23.2,0z" style={{ fill: 'white' }}></path>
    </g>
  </svg>
)

const Bobbel = ({ description, time, style }) => (
  <div className="flex flex-column justify-center items-center absolute" style={style}>
    <div>
      <small style={{ fontWeight: 400 }}>{description}</small>
    </div>
    <div className="relative">
      <span style={{ position: 'absolute', display: 'block', width: '100%', textAlign: 'center', top: '10px', fontWeight: 400 }}>{time}</span>
      <Marker />
    </div>
  </div>
)

class ResultScaleComponent extends Component {
  render() {
    return (
      <div className="relative pt6 pb1 mt1">
        {/*<div className="flex pr6 pl6">
          <div className="w-100">
            <div className="absolute">Pointer A</div>
            <div className="absolute">Pointer B</div>
          </div>
        </div>*/}
        <Bobbel description="With Speedkit" time="1s" style={{ left: '60px', top: '0px' }}/>
        <Bobbel description="Your Website" time="3s" style={{ left: '360px', top: '0px' }}/>
        <div className="flex" style={{ fontWeight: 400 }}>
          <div className="w-10 pa1 dark-green bg-dark-green border-left">Excellent</div>
          <div className="w-20 pa1 green bg-light-green">Good</div>
          <div className="w-30 pa1 orange bg-light-orange">Fair</div>
          <div className="w-40 pa1 red bg-light-red border-right">Poor</div>
        </div>
      </div>
    )
  }
}

export default ResultScaleComponent
