// Copyright 2017-2023, University of Colorado Boulder

/**
 *
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import tandemNamespace from './tandemNamespace.js';
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import TinyEmitter from '../../axon/js/TinyEmitter.js';

type DescriptionEntry = {
  // Boo, this doesn't work
  // [ K in string ]: K extends '_value' ? ( PhetioObject | null ) : DescriptionEntry;

  [ K: string ]: DescriptionEntry | PhetioObject | null;
};

export default class DescriptionRegistry {
  public static readonly root: DescriptionEntry = {};

  public static readonly map: Map<string, PhetioObject> = new Map<string, PhetioObject>();
  public static readonly inverseMap: Map<PhetioObject, string> = new Map<PhetioObject, string>();

  // tandemID, phetioObject
  public static readonly addedEmitter = new TinyEmitter<[ string, PhetioObject ]>();
  public static readonly removedEmitter = new TinyEmitter<[ string, PhetioObject ]>();

  public static add( tandem: Tandem, phetioObject: PhetioObject ): void {
    DescriptionRegistry.map.set( tandem.phetioID, phetioObject );
    DescriptionRegistry.inverseMap.set( phetioObject, tandem.phetioID );

    const bits = tandem.phetioID.split( '.' );
    let current: DescriptionEntry = DescriptionRegistry.root;
    for ( let i = 0; i < bits.length; i++ ) {
      const bit = bits[ i ];

      if ( !current[ bit ] ) {
        current[ bit ] = {};
      }
      current = current[ bit ] as DescriptionEntry;
    }
    current._value = phetioObject;

    DescriptionRegistry.addedEmitter.emit( tandem.phetioID, phetioObject );
  }

  public static remove( phetioObject: PhetioObject ): void {
    if ( DescriptionRegistry.inverseMap.has( phetioObject ) ) {

      const tandemID = DescriptionRegistry.inverseMap.get( phetioObject )!;

      DescriptionRegistry.removedEmitter.emit( tandemID, phetioObject );
      DescriptionRegistry.inverseMap.delete( phetioObject );
      DescriptionRegistry.map.delete( tandemID );

      const bits = tandemID.split( '.' );
      const entries: DescriptionEntry[] = [];
      let current: DescriptionEntry = DescriptionRegistry.root;
      for ( let i = 0; i < bits.length; i++ ) {
        const bit = bits[ i ];

        if ( current ) {
          current = current[ bit ] as DescriptionEntry;

          if ( current ) {
            entries.push( current );
          }
        }
      }

      if ( entries.length === bits.length ) {
        delete current._value;
      }

      for ( let i = entries.length - 1; i >= 0; i-- ) {
        const entry = entries[ i ];
        if ( entry && Object.keys( entry ).length === 0 ) {
          delete entries[ i ];
        }
      }
    }
  }
}

tandemNamespace.register( 'DescriptionRegistry', DescriptionRegistry );
