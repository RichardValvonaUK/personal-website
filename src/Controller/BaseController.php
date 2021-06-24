<?php
// src/Controller/BaseController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

use Symfony\Component\Asset\Package;
use Symfony\Component\Asset\PathPackage;
use Symfony\Component\Asset\VersionStrategy\EmptyVersionStrategy;
use Symfony\Component\Asset\VersionStrategy\StaticVersionStrategy;

class BaseController extends AbstractController
{
	
//	private array $fixedTemplateVariables = [
//		
//	];
	
	private $standardPageTemplateFile = 'standard-page.html.twig';
	private $mainPageTemplateFile = 'main-page.html.twig';
	
    /**
     * Overriding render() method of parent.
     */
    protected function render(string $view, array $parameters = [], Response $response = null): Response
    {
	    $package = new PathPackage($this->getParameter('kernel.project_dir'), new EmptyVersionStrategy());
		$menuFileContents = file_get_contents($package->getUrl('assets/menu.json'));
		
		$menuJSON = json_decode($menuFileContents);
    	
    	$parameters['menu'] = $menuJSON->menu;
    	
        return parent::render($view, $parameters, $response);
    }
    
    
	protected function getMainTemplateFile() : string {
		return $this->baseHTML;
	}
	
	protected function getStandardTemplateFile() : string {
		return $this->standardPageTemplateFile;
	}
}