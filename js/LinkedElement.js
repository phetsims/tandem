// Copyright 2018, University of Colorado Boulder

/**
 * TODO: Documentation
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const LinkedElementIO = require( 'TANDEM/LinkedElementIO' );

  class LinkedElement extends PhetioObject {

    /**
     * @param {Object} element
     * @param {Object} [options]
     */
    constructor( element, options ) {
      assert && assert( !!element, 'element should be defined' );
      assert && assert( element instanceof PhetioObject, 'element should be PhetioObject' );
      assert && assert( element.tandem, 'element should have a tandem' );
      super( _.extend( {
        phetioType: LinkedElementIO,
        phetioFeatured: element.phetioFeatured, // The link should be featured if the element itself is featured
        phetioReadOnly: true
      }, options ) );

      // @public (read-only)
      this.element = element;
    }
  }

  return tandemNamespace.register( 'LinkedElement', LinkedElement );
} );