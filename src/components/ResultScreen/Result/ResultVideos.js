import React, { Component } from 'react'
import './Result.css'
import { isDeviceIOS } from '../../../helper/utils'

class ResultVideos extends Component {

  playVideos = (videoLabel) => {
    this[videoLabel].currentTime = 0
    const playPromise = this[videoLabel].play()
    if (!isDeviceIOS()) {
      playPromise.then(() => {
        const secondVideo = videoLabel === 'speedKitVideo' ? 'competitorVideo' : 'speedKitVideo'
        if(this[secondVideo]) {
          this[secondVideo].currentTime = 0
          this[secondVideo].play()
        }
      }).catch(error => {})
    }
  }

  // componentDidMount() {
  //   setTimeout(() => {
  //     this.playVideos('competitorVideo')
  //   }, 500)
  // }

  render() {
    const competitorVideoPath = this.props.competitorTest.videoFileFirstView
    const speedKitVideoPath = this.props.speedKitTest.videoFileFirstView
    // const data = this.props.testOverview.psiScreenshot
    // <img src={`data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')}`} />
    // poster={`data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')}`}
    return (
      <div className="flex justify-center">
        <div className="w-50 pa2 pv4-ns ph6-ns">
          <div className="video__wrapper">
            <div className="video__wrapper-inner">
              <div className="relative" style={{ width: '100%', height: '100%'}}>
                <video id="competitorVideo"
                  playsInline
                  controls={false}
                  autoPlay
                  className="embedVideo"
                  ref={(video) => {this.competitorVideo = video}}
                  onClick={() => this.playVideos('competitorVideo')}
                  onPlay={() => this.playVideos('competitorVideo')}
                  src={competitorVideoPath && 'https://makefast.app.baqend.com/v1' + competitorVideoPath} />
                {/*<div style={{ backgroundImage: `url(data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')})`}}></div>*/}
              </div>
            </div>
          </div>
        </div>
        {!this.props.speedKitError && (
          <div className="w-50 speedKitVideo pa2 pv4-ns ph6-ns">
            <div className="video__wrapper">
              <div className="video__wrapper-inner">
                <div className="relative" style={{ width: '100%', height: '100%'}}>
                  <video id="speedKitVideo"
                    playsInline
                    controls={false}
                    autoPlay
                    className="embedVideo"
                    ref={(video) => {this.speedKitVideo = video}}
                    onClick={() => this.playVideos('speedKitVideo')}
                    onPlay={() => this.playVideos('speedKitVideo')}
                    src={speedKitVideoPath && 'https://makefast.app.baqend.com/v1' + speedKitVideoPath} />
                  {/*<div style={{ backgroundImage: `url(data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')})`}}></div>*/}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default ResultVideos
