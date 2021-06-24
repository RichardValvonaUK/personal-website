<?php
// src/Controller/StaticPageController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class StaticPageController extends BaseController
{
     /**
      * @Route("/")
      */
    public function index(): Response
    {
		return $this->render('pages/index.html.twig');
    }
    
    
     /**
      * @Route("/russian-lab/{page}")
      */
    public function russianPage($page): Response
    {
    
		return $this->render("pages/russian-lab/$page.html.twig");
    }
    
    
     /**
      * @Route("/misc/{page}")
      */
    public function miscPage($page): Response
    {
    
		return $this->render("pages/misc/$page.html.twig");
    }
    
    
     /**
      * @Route("/trip-to-bellingham/{page}")
      */
    public function travelBellinghamPage($page): Response
    {
		return $this->render("pages/trip-to-bellingham/$page.html.twig");
    }
    

	 /**
	  * @Route("/{page}")
	  */
	public function pageAction($page): Response
	{
		return $this->render("pages/$page.html.twig");
	}
}