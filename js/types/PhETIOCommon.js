// Copyright 2016, University of Colorado Boulder

/**
 * phetio.js provides an API for accessing the simulation for enhanced features.  This file defines common wrapper
 * types for elements that appear in the simulation-specific API files, as well as utilities for creating components for
 * joist features such as the navbar and home screen.
 *
 * These wrapper types declare the following features:
 * 1. How an element from the sim wires up to phetioEvents for data streaming
 * 2. How an element converts to/from JSON for serialization
 * 3. How an element is formatted for the phetioEvents data stream
 * 4. How an element is configured by query parameters
 * 5. The API for interoperating with an element while the sim is running.
 *
 * These type declarations are a "pared down" version of the full types, just providing access to important features.
 * Having a separate hierarchy for these wrapper types empowers us to vary the implementation (in the sim) independently
 * from how it appears in the phet-io API.
 *
 * Throughout the file we use onStatic instead of on to improve performance and memory characteristics, since
 * we have the special condition that listeners will not be removed during callbacks, see #81
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author John Blanco (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TButton = require( 'PHET_IO/types/sun/buttons/TButton' );
  var TPhetButton = require( 'PHET_IO/types/joist/TPhetButton' );
  var TPhETIO = require( 'PHET_IO/types/TPhETIO' );
  var TPhetMenu = require( 'PHET_IO/types/joist/TPhetMenu' );
  var TScreenButton = require( 'PHET_IO/types/joist/TScreenButton' );
  var TSim = require( 'PHET_IO/types/joist/TSim' );

  var phetButtonAPI = TPhetButton.extend( {
    phetMenu: TPhetMenu
  } );

  /**
   * The API for the home screen has the ScreenButtons and the phetButton
   * @param screenNames
   * @returns {object} the homeScreenAPI for a multiple-screen sim
   */
  var getHomeScreenAPI = function( screenNames ) {
    var homeScreenAPI = { phetButton: phetButtonAPI };
    for ( var i = 0; i < screenNames.length; i++ ) {
      var screenName = screenNames[ i ];
      homeScreenAPI[ screenName + 'ScreenSmallButton' ] = TScreenButton;
      homeScreenAPI[ screenName + 'ScreenLargeButton' ] = TScreenButton;
    }
    return homeScreenAPI;
  };

  var getNavigationBarAPI = function( screenNames ) {

    var screenButtons = {};
    if ( screenNames ) {
      for ( var i = 0; i < screenNames.length; i++ ) {
        screenButtons[ screenNames[ i ] + 'ScreenButton' ] = TButton;
      }
    }

    return _.extend( {
      homeButton: TPhetButton,
      phetButton: phetButtonAPI
    }, screenButtons );
  };

  var PhETIOCommon = {
    createAPI: function( child ) {
      return _.extend( { phetio: TPhETIO }, child );
    },
    createSim: function( child ) {

      var endsWith = function( string, suffix ) {
        return string.indexOf( suffix, string.length - suffix.length ) !== -1;
      };
      var screenNames = _.keys( child )
        .filter( function( key ) {
          return endsWith( key, 'Screen' );
        } )
        .map( function( key ) {
          return key.substring( 0, key.length - 'Screen'.length );
        } );

      if ( screenNames.length > 1 ) {
        return _.extend( {
          sim: TSim,
          homeScreen: getHomeScreenAPI( screenNames ),
          navigationBar: getNavigationBarAPI( screenNames )
        }, child );
      }
      else {
        return _.extend( {
          sim: TSim,
          navigationBar: getNavigationBarAPI( screenNames )
        }, child );
      }
    }
  };

  phetioNamespace.register( 'PhETIOCommon', PhETIOCommon );

  return PhETIOCommon;
} );