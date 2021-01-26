// Copyright 2020, University of Colorado Boulder

import animationFrameTimer from '../../axon/js/animationFrameTimer.js';
import tandemNamespace from './tandemNamespace.js';

const onInstance = callback => animationFrameTimer.runOnNextTick( callback );

tandemNamespace.register( 'onInstance', onInstance );
export default onInstance;