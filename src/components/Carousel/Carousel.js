import React, { Component } from 'react'
import PropTypes from 'prop-types'

import CarouselComponent from './CarouselComponent'

class Carousel extends Component {
  render() {
    return (
      <CarouselComponent { ...this.props }/>
    )
  }
}

Carousel.propTypes = {
  showFirstPool: PropTypes.bool.isRequired,
  animationDuration: PropTypes.string,
  animationDelay: PropTypes.string
}

export default Carousel
