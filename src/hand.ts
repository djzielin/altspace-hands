/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

//import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as MRE from '../../mixed-reality-extension-sdk/packages/sdk'; //using our modded version of MRE
import { Vector3, log } from '../../mixed-reality-extension-sdk/packages/sdk';

//import colorsys from 'colorsys';

export default class SoundHand {
	private soundActor: MRE.Actor;
	private playingSounds: MRE.MediaInstance[] = [];
	private boxMesh: MRE.Mesh;
	private visCubes: MRE.Actor[] = [];
	private visCubes2: MRE.Actor[] = [];
	private frameCounter=0;
	private currentCube: MRE.Actor=null;
	private cubeTarget: MRE.Vector3;
	private currentCube2: MRE.Actor=null;
	private cubeTarget2: MRE.Vector3;

	constructor(private handName: string, private context: MRE.Context, private assets: MRE.AssetContainer) {
		this.soundActor = MRE.Actor.Create(context);
		this.boxMesh = this.assets.createBoxMesh('box', .02, 0.02, 0.02);

		for(let i=0;i<60;i++) {
			const ourMat: MRE.Material = this.assets.createMaterial('cube mat',{
				color: new MRE.Color4(1.0,1.0,1.0,1.0)
			});

			const ourBox = MRE.Actor.Create(this.context, {
				actor: {
					name: 'box'+i,
					transform: {
						local: { position: new MRE.Vector3(0, 0, 0) },
						app: { position: new MRE.Vector3(0, 0, 0) }
					},
					appearance:
					{
						meshId: this.boxMesh.id,
						materialId: ourMat.id
					},
				}
			});

			this.visCubes.push(ourBox);
		}
	}

	public computeFlatDistance(ourVec: MRE.Vector3, ourVec2: MRE.Vector3) {
		const tempPos = ourVec.clone();
		const tempPos2=ourVec2.clone();
		tempPos.y = 0; //ignore height off the ground
		tempPos2.y=0;
		return (tempPos.subtract(tempPos2)).length();
	}

	public playSound(theSound: MRE.Sound) {
		const soundInstance: MRE.MediaInstance = this.soundActor.startSound(theSound.id, {
			doppler: 0,
			pitch: 0.0,
			looping: true,
			volume: 0.0
		});

		this.playingSounds.push(soundInstance); //store for later use
	}

	private clampVal(incoming: number, min: number, max: number): number {
		if (incoming < min) {
			return min;
		}
		if (incoming > max) {
			return max;
		}
		return incoming;
	}

	public updateSound(handName: string, handPos: MRE.Vector3,handPos2: MRE.Vector3) {
		const flatDist: number = this.computeFlatDistance(handPos,handPos2);
		const distClamped: number = this.clampVal(flatDist,0.0,2.0);

		const ourPitch = (distClamped*0.5) * -30.0;
		let ourVol = 1.0;
		
		if (flatDist > 2.0) {
			ourVol = 0.0;
		}

		//MRE.log.info("app", this.handName);
		//MRE.log.info("app", "     handpos1: " + handPos);
		//MRE.log.info("app", "     handpos2: " + handPos2);
		//MRE.log.info("app", "     dist: " + flatDist);
		//MRE.log.info("app", "     height: " + ourHeight);
		//MRE.log.info("app", "     pitch: " + ourPitch);
		//MRE.log.info("app", "     vol: " + ourVol);


		this.playingSounds[0].setState(
			{
				pitch: ourPitch,
				volume: ourVol
			});

		if (this.frameCounter % 5 === 0) {
			if (flatDist < 2.0) {
				if (this.currentCube) {				
					this.currentCube.animateTo({
						transform: {
							local: { position: this.cubeTarget }
						}
					}, 1.0 * flatDist, MRE.AnimationEaseCurves.Linear);
				}
				if(this.currentCube2) {
					this.currentCube2.animateTo({
						transform: {
							local: { position: this.cubeTarget2 }
						}
					}, 1.0 * flatDist, MRE.AnimationEaseCurves.Linear);
				}

				////////////////// User 1 ---> User 2 /////////////////////
				this.currentCube= this.visCubes.shift();
				this.currentCube.transform.app.position=new Vector3(0,0,0);

				const jitteredHandPos = new Vector3(
					handPos.x + (Math.random() * 0.005),
					handPos.y + (Math.random() * 0.005),
					handPos.z + (Math.random() * 0.005));
	
				this.currentCube.transform.local.position=jitteredHandPos;
				this.cubeTarget = handPos2;
				this.currentCube.appearance.material.color=	new MRE.Color4(1.0, 0.0, 0.0, 1.0);			
				this.visCubes.push(this.currentCube); //add back to the end of the queue*/

				////////////////// User 2 ---> User 1 /////////////////////
				this.currentCube2= this.visCubes.shift();
				this.currentCube2.transform.app.position=new Vector3(0,0,0);

				const jitteredHandPos2 = new Vector3(
					handPos2.x + (Math.random() * 0.005),
					handPos2.y + (Math.random() * 0.005),
					handPos2.z + (Math.random() * 0.005));

				this.currentCube2.transform.local.position=jitteredHandPos2; 
				this.cubeTarget2 = handPos;
				this.currentCube2.appearance.material.color=	new MRE.Color4(0.0, 1.0, 0.0, 1.0);					
				this.visCubes.push(this.currentCube2); //add back to the end of the queue
				
				
			}
		}

		//for some reason waiting one frame gives time for position change take effect
		/*if ((this.frameCounter - 2) % 3 === 0) {
			
		}*/

		this.frameCounter++;
	}
}
