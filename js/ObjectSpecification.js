// Copyright 2020, University of Colorado Boulder

import tandemNamespace from './tandemNamespace.js';

class ObjectSpecification {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    // @public (read-only) - uninstrumented APIs won't hae an associated PhetioObject, as they are just "intermediate" phetioID structure
    // TODO: https://github.com/phetsims/phet-io/issues/1657 this is probably unnecessary
    this.uninstrumented = true;

    // @protected
    this.options = options;
  }

  // @public
  test( object ) {

    // no assertion errors

  }
}

tandemNamespace.register( 'ObjectSpecification', ObjectSpecification );
export default ObjectSpecification;