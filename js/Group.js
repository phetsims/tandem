// Copyright 2019, University of Colorado Boulder

/**
 * Provides a placeholder in the static API for where dynamic elements may be created.  Checks that members of the group
 * match the approved schema.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const GroupIO = require( 'TANDEM/types/GroupIO' );

  class Group extends PhetioObject {

    /**
     * @param {Object} [options] - describe the Group itself
     */
    constructor( options ) {

      options = _.extend( {
        phetioType: GroupIO
      }, options );

      super( options );
    }
  }

  return tandemNamespace.register( 'Group', Group );
} );